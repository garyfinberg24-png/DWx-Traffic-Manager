export interface User {
  id: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  photo?: string;
  isManager?: boolean;
  groupMemberships?: string[];
}

// Azure AD Group ID for managers - configure in environment
// To find your group ID: Azure Portal > Azure Active Directory > Groups > [Group Name] > Object ID
export const MANAGER_GROUP_ID = import.meta.env.VITE_MANAGER_GROUP_ID || '';

// Fallback manager emails - used when Azure AD group check is not configured
// In production, prefer Azure AD groups over this list
export const FALLBACK_MANAGER_EMAILS = [
  'gary@firsttech.digital',
  'admin@firsttech.digital',
  'Gulzar.Ismail@firsttech.digital',
  'wimpie.baard@firsttech.digital',
  'chris@firsttech.digital',
];

// Check if user is manager by email (fallback method)
export const isUserManagerByEmail = (email: string): boolean => {
  const isManager = FALLBACK_MANAGER_EMAILS.some(
    (managerEmail) => managerEmail.toLowerCase() === email.toLowerCase()
  );
  console.log('[isUserManagerByEmail] Checking email:', email, 'against list:', FALLBACK_MANAGER_EMAILS, 'Result:', isManager);
  return isManager;
};

// Main function to check if user is manager
// Uses Azure AD group membership when available, falls back to email list
export const isUserManager = (email: string, groupMemberships?: string[]): boolean => {
  console.log('[isUserManager] Checking:', { email, groupMemberships, MANAGER_GROUP_ID });

  // If group membership is provided and manager group is configured
  if (groupMemberships && groupMemberships.length > 0 && MANAGER_GROUP_ID) {
    const result = groupMemberships.includes(MANAGER_GROUP_ID);
    console.log('[isUserManager] Using group membership check, result:', result);
    return result;
  }

  // Fallback to email list
  const result = isUserManagerByEmail(email);
  console.log('[isUserManager] Using email fallback, result:', result);
  return result;
};
