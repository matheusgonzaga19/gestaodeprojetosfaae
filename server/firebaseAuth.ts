import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

let initialized = false;

export async function setupAuth(_app: Express) {
  if (!initialized) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    initialized = true;
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const idToken = header.split(' ')[1];
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    (req as any).user = decoded;
    await storage.upsertUser({
      id: decoded.uid,
      email: decoded.email ?? null,
      firstName: decoded.name?.split(' ')[0] ?? null,
      lastName: decoded.name?.split(' ').slice(1).join(' ') || null,
      profileImageUrl: decoded.picture ?? null,
    });
    next();
  } catch (err) {
    console.error('Firebase auth error', err);
    res.status(401).json({ message: 'Unauthorized' });
  }
};
