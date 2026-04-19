import { auth } from './firebase';

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string | null; email: string | null; }[];
  }
}

export function handleFirestoreError(
  error: any, 
  operationType: FirestoreErrorInfo['operationType'], 
  path: string | null = null
) {
  const currentUser = auth.currentUser;
  
  const errorInfo: FirestoreErrorInfo = {
    error: error?.message || 'Unknown Firestore error',
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || false,
      isAnonymous: currentUser?.isAnonymous || false,
      providerInfo: currentUser?.providerData.map(p => ({
        providerId: p.providerId,
        displayName: p.displayName,
        email: p.email
      })) || []
    }
  };

  const errorString = JSON.stringify(errorInfo, null, 2);
  console.error("Firestore Error Detailed:", errorString);
  
  if (error?.code === 'permission-denied' || error?.message?.includes('insufficient permissions')) {
    throw new Error(errorString);
  }
  
  throw error;
}
