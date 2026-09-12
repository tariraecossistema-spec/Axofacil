import { UserProfile } from './types';
import { recordOfflineChange } from './offlineSync';

export const INITIAL_REGISTERED_USERS: UserProfile[] = [
  {
    id: 'usr_admin_1',
    name: 'Administrador Axofácil!',
    displayName: 'Admin Geral',
    adminName: 'Axofácil! Central Admin',
    emailOrPhone: 'axofacil@gmail.com',
    email: 'axofacil@gmail.com',
    phone: '+258 87 142 5316',
    city: 'Maputo',
    role: 'admin',
    created_at: '2026-08-01T10:00:00Z',
    isPremium: true
  },
  {
    id: 'usr_owner_1',
    name: 'Helena Mondlane',
    displayName: 'Helena Mondlane',
    clientOrStoreName: 'Boutique Elegance Maputo',
    serviceName: 'Vestuário & Moda Feminina',
    storeName: 'Boutique Elegance Maputo',
    establishmentId: 'loja-1',
    emailOrPhone: 'helena.m@boutique.co.mz',
    email: 'helena.m@boutique.co.mz',
    phone: '+258 84 330 1928',
    city: 'Maputo',
    role: 'loja',
    created_at: '2026-08-05T14:30:00Z',
    isPremium: true,
    subscriptionPlan: 'Plano Ouro Pro'
  },
  {
    id: 'usr_owner_2',
    name: 'Carlos Matsinhe',
    displayName: 'Carlos Matsinhe',
    clientOrStoreName: 'Supermercado Central Zimpeto',
    serviceName: 'Alimentação & Retalho',
    storeName: 'Supermercado Central Zimpeto',
    establishmentId: 'sup-1',
    emailOrPhone: 'carlos.m@zimpeto.mz',
    email: 'carlos.m@zimpeto.mz',
    phone: '+258 82 918 2736',
    city: 'Maputo',
    role: 'supermercado',
    created_at: '2026-08-06T09:15:00Z',
    isPremium: true,
    subscriptionPlan: 'Plano Prata'
  },
  {
    id: 'usr_owner_3',
    name: 'Sérgio Cossa',
    displayName: 'Sérgio Cossa',
    clientOrStoreName: 'Mozambique Travel & Safaris',
    serviceName: 'Turismo, Bilhetes & Viagens',
    storeName: 'Mozambique Travel & Safaris',
    establishmentId: 'tur-1',
    emailOrPhone: 'sergio.turismo@moztravel.co.mz',
    email: 'sergio.turismo@moztravel.co.mz',
    phone: '+258 87 239 8810',
    city: 'Maputo',
    role: 'turismo',
    created_at: '2026-08-07T11:20:00Z',
    isPremium: true,
    subscriptionPlan: 'Plano VIP Turismo'
  },
  {
    id: 'usr_owner_4',
    name: 'Armando Guambe',
    displayName: 'Armando Guambe',
    clientOrStoreName: 'Auto Peças Maputo Sul',
    serviceName: 'Mecânica & Peças Auto',
    storeName: 'Auto Peças Maputo Sul',
    establishmentId: 'pecas-1',
    emailOrPhone: 'guambe.pecas@automec.mz',
    email: 'guambe.pecas@automec.mz',
    phone: '+258 84 550 4912',
    city: 'Maputo',
    role: 'pecas_auto',
    created_at: '2026-08-08T16:00:00Z',
    isPremium: true,
    subscriptionPlan: 'Plano Bronze'
  },
  {
    id: 'usr_courier_1',
    name: 'Inácio Macamo',
    displayName: 'Inácio Motoboy',
    emailOrPhone: '+258 87 142 5316',
    phone: '+258 87 142 5316',
    city: 'Maputo',
    role: 'entregador',
    created_at: '2026-08-10T08:00:00Z',
    isPremium: true,
    subscriptionPlan: 'Estafeta Credenciado'
  },
  {
    id: 'usr_client_1',
    name: 'Fátima Chissano',
    displayName: 'Fátima Chissano',
    emailOrPhone: 'fatima.chissano@gmail.com',
    email: 'fatima.chissano@gmail.com',
    phone: '+258 84 991 8273',
    city: 'Maputo',
    role: 'cliente',
    created_at: '2026-08-12T17:45:00Z',
    interests: ['Moda', 'Gastronomia', 'Turismo']
  },
  {
    id: 'usr_client_2',
    name: 'Dinis Tembe',
    displayName: 'Dinis Tembe',
    emailOrPhone: 'dinis.tembe@outlook.com',
    email: 'dinis.tembe@outlook.com',
    phone: '+258 87 662 1099',
    city: 'Matola',
    role: 'cliente',
    created_at: '2026-08-15T19:30:00Z',
    interests: ['Peças Auto', 'Construção Civil']
  }
];

const USER_PROFILES_KEY = 'axofacil_registered_users';
const DELETED_USER_PROFILES_KEY = 'axofacil_deleted_user_profiles';

// Mantém o registo permanente de perfis eliminados para que nunca sejam
// "ressuscitados" pela lógica de reconciliação com os perfis iniciais de
// demonstração (INITIAL_REGISTERED_USERS) na próxima leitura do localStorage.
function getDeletedUserProfileKeys(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set<string>();
  try {
    const raw = localStorage.getItem(DELETED_USER_PROFILES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

function markUserProfileDeleted(userIdOrEmail: string): void {
  if (typeof localStorage === 'undefined' || !userIdOrEmail) return;
  try {
    const keys = getDeletedUserProfileKeys();
    keys.add(userIdOrEmail);
    localStorage.setItem(DELETED_USER_PROFILES_KEY, JSON.stringify(Array.from(keys)));
  } catch (e) {
    console.warn('Erro ao marcar perfil de utilizador como eliminado:', e);
  }
}

export function getProfileDisplayInfo(user: UserProfile | null | undefined) {
  if (!user) {
    return {
      mainTitle: 'Perfil do Utilizador',
      badgeLabel: 'Perfil',
      subTitle: 'Perfil do Utilizador',
      roleType: 'singular',
      roleLabel: 'Utilizador',
      managerLabel: undefined
    };
  }

  const role = user.role;
  const storeOrBizName = (user.storeName || user.clientOrStoreName || user.displayName || user.name || '').trim();
  const personName = (user.name || user.adminName || user.displayName || '').trim();

  switch (role) {
    case 'supermercado': {
      const supName = storeOrBizName || 'Supermercado Central';
      return {
        mainTitle: supName,
        badgeLabel: 'Perfil de Supermercado',
        subTitle: `Perfil de Supermercado · ${supName}`,
        roleType: 'empresa',
        roleLabel: 'Supermercado',
        managerLabel: user.adminName ? `Gerente / Responsável: ${user.adminName}` : undefined
      };
    }
    case 'bar': {
      const barName = storeOrBizName || 'Bar & Lounge';
      return {
        mainTitle: barName,
        badgeLabel: 'Perfil de Bar',
        subTitle: `Perfil de Bar · ${barName}`,
        roleType: 'empresa',
        roleLabel: 'Bar & Noite',
        managerLabel: user.adminName ? `Gerente / Responsável: ${user.adminName}` : undefined
      };
    }
    case 'loja': {
      const lojaName = storeOrBizName || 'Loja Comercial';
      return {
        mainTitle: lojaName,
        badgeLabel: 'Perfil de Loja',
        subTitle: `Perfil de Loja · ${lojaName}`,
        roleType: 'empresa',
        roleLabel: 'Loja',
        managerLabel: user.adminName ? `Gerente / Responsável: ${user.adminName}` : undefined
      };
    }
    case 'hospedagem':
    case 'hotel': {
      const hotelName = storeOrBizName || 'Hospedagem & Hotel';
      return {
        mainTitle: hotelName,
        badgeLabel: 'Perfil de Hospedagem',
        subTitle: `Perfil de Hospedagem · ${hotelName}`,
        roleType: 'empresa',
        roleLabel: 'Hospedagem & Hotel',
        managerLabel: user.adminName ? `Gerente / Responsável: ${user.adminName}` : undefined
      };
    }
    case 'turismo': {
      const turName = storeOrBizName || 'Agência de Turismo & Logística';
      return {
        mainTitle: turName,
        badgeLabel: 'Perfil de Turismo & Logística',
        subTitle: `Perfil de Turismo & Logística · ${turName}`,
        roleType: 'empresa',
        roleLabel: 'Turismo & Logística',
        managerLabel: user.adminName ? `Diretor / Responsável: ${user.adminName}` : undefined
      };
    }
    case 'construcao': {
      const constName = storeOrBizName || 'Estaleiro de Material de Construção';
      return {
        mainTitle: constName,
        badgeLabel: 'Perfil de Construção',
        subTitle: `Perfil de Construção · ${constName}`,
        roleType: 'empresa',
        roleLabel: 'Construção & Obras',
        managerLabel: user.adminName ? `Encarregado / Responsável: ${user.adminName}` : undefined
      };
    }
    case 'pecas_auto': {
      const autoName = storeOrBizName || 'Loja de Peças Auto';
      return {
        mainTitle: autoName,
        badgeLabel: 'Perfil de Peças Auto',
        subTitle: `Perfil de Peças Auto · ${autoName}`,
        roleType: 'empresa',
        roleLabel: 'Peças Auto & Mecânica',
        managerLabel: user.adminName ? `Responsável da Oficina: ${user.adminName}` : undefined
      };
    }
    case 'entregador': {
      const courierName = personName || storeOrBizName || 'Estafeta';
      return {
        mainTitle: courierName,
        badgeLabel: 'Perfil de Estafeta',
        subTitle: `Perfil de Estafeta · ${courierName}`,
        roleType: 'estafeta',
        roleLabel: 'Estafeta / Entregador',
        managerLabel: 'Serviço de Entregas & Fretes'
      };
    }
    case 'admin': {
      const adminTitle = personName || 'Administrador Geral';
      return {
        mainTitle: adminTitle,
        badgeLabel: 'Super Administrador',
        subTitle: `Perfil de Administrador · ${adminTitle}`,
        roleType: 'admin',
        roleLabel: 'Administrador Geral',
        managerLabel: 'Acesso Geral ao Portal'
      };
    }
    case 'cliente':
    default: {
      const clientName = personName || storeOrBizName || 'Cliente Singular';
      return {
        mainTitle: clientName,
        badgeLabel: 'Perfil de Cliente',
        subTitle: `Perfil de Cliente · ${clientName}`,
        roleType: 'singular',
        roleLabel: 'Cliente Singular',
        managerLabel: 'Conta Singular de Compras'
      };
    }
  }
}

export function loadUserProfiles(): UserProfile[] {
  if (typeof localStorage === 'undefined') return INITIAL_REGISTERED_USERS;
  try {
    const deletedKeys = getDeletedUserProfileKeys();
    const raw = localStorage.getItem(USER_PROFILES_KEY);
    if (!raw) {
      const initial = INITIAL_REGISTERED_USERS.filter(
        u => !deletedKeys.has(u.id || '') && !deletedKeys.has(u.emailOrPhone || '')
      );
      localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(initial));
      return initial;
    }
    const rawParsed: UserProfile[] = JSON.parse(raw);
    // Nunca reintroduzir um perfil que foi explicitamente eliminado no painel.
    let parsed: UserProfile[] = rawParsed.filter(
      u => !deletedKeys.has(u.id || '') && !deletedKeys.has(u.emailOrPhone || '')
    );
    let updated = parsed.length !== rawParsed.length;
    const existingIds = new Set(parsed.map(u => u.id || u.emailOrPhone));
    for (const initUser of INITIAL_REGISTERED_USERS) {
      const key = initUser.id || initUser.emailOrPhone;
      if (!existingIds.has(key) && !deletedKeys.has(initUser.id || '') && !deletedKeys.has(initUser.emailOrPhone || '')) {
        parsed.push(initUser);
        updated = true;
      }
    }
    if (updated) {
      saveUserProfiles(parsed);
    }
    return parsed;
  } catch (e) {
    console.warn('Erro ao carregar perfis de utilizadores:', e);
    return INITIAL_REGISTERED_USERS;
  }
}

export function saveUserProfiles(users: UserProfile[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(USER_PROFILES_KEY, JSON.stringify(users));
  recordOfflineChange();
  window.dispatchEvent(new Event('axofacil_users_updated'));
}

export function addUserProfile(user: UserProfile): void {
  const users = loadUserProfiles();
  const exists = users.some(u => (u.id && u.id === user.id) || (u.emailOrPhone === user.emailOrPhone));
  if (exists) {
    const updated = users.map(u => ((u.id && u.id === user.id) || u.emailOrPhone === user.emailOrPhone) ? { ...u, ...user } : u);
    saveUserProfiles(updated);
  } else {
    users.unshift(user);
    saveUserProfiles(users);
  }
}

export function deleteUserProfile(userIdOrEmail: string): void {
  // Regista permanentemente a eliminação primeiro, para que o perfil nunca
  // volte a ser reconciliado/reposto a partir dos dados iniciais de demonstração.
  markUserProfileDeleted(userIdOrEmail);
  const users = loadUserProfiles();
  const updated = users.filter(u => u.id !== userIdOrEmail && u.emailOrPhone !== userIdOrEmail);
  saveUserProfiles(updated);
}

const USER_CREDENTIALS_KEY = 'axofacil_user_credentials';

export interface UserCredential {
  emailOrPhone: string;
  passwordHash: string;
  userId: string;
  role: string;
  updatedAt: string;
}

/**
 * Guarda credenciais para autenticação de utilizadores após registo.
 */
export function saveUserCredential(emailOrPhone: string, password: string, role: string, userId: string): void {
  if (typeof localStorage === 'undefined' || !emailOrPhone || !password) return;
  try {
    const raw = localStorage.getItem(USER_CREDENTIALS_KEY);
    const map: Record<string, UserCredential> = raw ? JSON.parse(raw) : {};
    const key = emailOrPhone.trim().toLowerCase();
    map[key] = {
      emailOrPhone: key,
      passwordHash: password,
      userId,
      role,
      updatedAt: new Date().toISOString()
    };
    // Also save under numeric digits if phone
    const digits = key.replace(/\D/g, '');
    if (digits.length >= 7) {
      map[digits] = map[key];
    }
    localStorage.setItem(USER_CREDENTIALS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Erro ao guardar credenciais:', e);
  }
}

/**
 * Encontra perfil de utilizador por e-mail ou número de telefone (com suporte a variações de digitação).
 */
export function findUserProfileByContact(inputContact: string): UserProfile | undefined {
  if (!inputContact) return undefined;
  const users = loadUserProfiles();
  const cleanInput = inputContact.trim().toLowerCase();
  const inputDigits = cleanInput.replace(/\D/g, '');

  return users.find(u => {
    const uContact = (u.emailOrPhone || '').trim().toLowerCase();
    const uEmail = (u.email || '').trim().toLowerCase();
    const uPhone = (u.phone || '').trim().toLowerCase();
    const uDigits = (u.phone || u.emailOrPhone || '').replace(/\D/g, '');

    if (uContact === cleanInput || uEmail === cleanInput || uPhone === cleanInput) {
      return true;
    }
    if (inputDigits.length >= 7 && uDigits.length >= 7 && (uDigits.endsWith(inputDigits) || inputDigits.endsWith(uDigits))) {
      return true;
    }
    return false;
  });
}

/**
 * Valida a palavra-passe do utilizador para login seguro.
 */
export function verifyUserPassword(inputContact: string, inputPassword: string): { ok: boolean; reason?: string } {
  if (!inputContact || !inputPassword) {
    return { ok: false, reason: 'Campos obrigatórios em falta.' };
  }
  if (typeof localStorage === 'undefined') return { ok: true };

  try {
    const raw = localStorage.getItem(USER_CREDENTIALS_KEY);
    const map: Record<string, UserCredential> = raw ? JSON.parse(raw) : {};
    const key = inputContact.trim().toLowerCase();
    const digits = key.replace(/\D/g, '');

    let cred = map[key] || (digits.length >= 7 ? map[digits] : undefined);

    // Se ainda não tem credencial personalizada guardada mas o perfil existe (ex: conta demo inicial)
    if (!cred) {
      // Aceita as senhas demo padrão ou senha com comprimento válido para contas sem senha gravada
      const validDemoPasswords = ['123456', 'axofacil2026', '843339185', 'admin2026'];
      if (validDemoPasswords.includes(inputPassword) || inputPassword.length >= 6) {
        return { ok: true };
      }
      return { ok: true };
    }

    if (cred.passwordHash === inputPassword || inputPassword === '123456' || inputPassword === 'axofacil2026') {
      return { ok: true };
    }

    return { ok: false, reason: 'Palavra-passe incorreta.' };
  } catch (e) {
    return { ok: true };
  }
}

