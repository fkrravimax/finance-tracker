import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { users, accounts, sessions, verifications } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import crypto from 'crypto';

const router = Router();

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://rupiku.vercel.app';
const BACKEND_URL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const REDIRECT_URI = `${BACKEND_URL}/api/auth/google/callback`;

/**
 * GET /api/auth/google/redirect
 * Generates state, stores in DB, redirects to Google OAuth
 */
router.get('/redirect', async (req: Request, res: Response) => {
    try {
        // Generate random state for CSRF protection
        const state = crypto.randomBytes(32).toString('hex');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

        // Store state in verification table
        await db.insert(verifications).values({
            id: randomUUID(),
            identifier: 'google-oauth-state',
            value: state,
            expiresAt,
            createdAt: now,
            updatedAt: now,
        });

        // Build Google OAuth URL
        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            response_type: 'code',
            scope: 'openid email profile',
            state,
            access_type: 'offline',
            prompt: 'consent',
        });

        res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
    } catch (error: any) {
        console.error('Google OAuth redirect error:', error);
        res.redirect(`${FRONTEND_URL}/login?error=oauth_init_failed`);
    }
});

/**
 * GET /api/auth/google/callback
 * Validates state, exchanges code, creates user/session, redirects to frontend
 */
router.get('/callback', async (req: Request, res: Response) => {
    try {
        const { code, state, error: oauthError } = req.query;

        if (oauthError) {
            console.error('Google OAuth error:', oauthError);
            return res.redirect(`${FRONTEND_URL}/login?error=google_denied`);
        }

        if (!code || !state) {
            return res.redirect(`${FRONTEND_URL}/login?error=missing_params`);
        }

        // 1. Validate state from database
        const [storedState] = await db
            .select()
            .from(verifications)
            .where(
                and(
                    eq(verifications.identifier, 'google-oauth-state'),
                    eq(verifications.value, state as string)
                )
            )
            .limit(1);

        if (!storedState) {
            console.error('State not found in database');
            return res.redirect(`${FRONTEND_URL}/login?error=invalid_state`);
        }

        // Check expiration
        if (new Date() > storedState.expiresAt) {
            await db.delete(verifications).where(eq(verifications.id, storedState.id));
            return res.redirect(`${FRONTEND_URL}/login?error=state_expired`);
        }

        // Delete used state (one-time use)
        await db.delete(verifications).where(eq(verifications.id, storedState.id));

        // 2. Exchange authorization code for tokens
        const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code as string,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errBody = await tokenResponse.text();
            console.error('Token exchange failed:', errBody);
            return res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
        }

        const tokenData = await tokenResponse.json();

        // 3. Get user info from Google
        const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        if (!userInfoResponse.ok) {
            console.error('Failed to fetch user info');
            return res.redirect(`${FRONTEND_URL}/login?error=userinfo_failed`);
        }

        const googleUser = await userInfoResponse.json();
        // googleUser: { id, email, name, picture, verified_email }

        const now = new Date();

        // 4. Find or create user
        let [existingAccount] = await db
            .select()
            .from(accounts)
            .where(
                and(
                    eq(accounts.providerId, 'google'),
                    eq(accounts.accountId, googleUser.id)
                )
            )
            .limit(1);

        let userId: string;

        if (existingAccount) {
            // User already linked with Google - update tokens
            userId = existingAccount.userId;
            await db
                .update(accounts)
                .set({
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token || existingAccount.refreshToken,
                    idToken: tokenData.id_token,
                    accessTokenExpiresAt: tokenData.expires_in
                        ? new Date(now.getTime() + tokenData.expires_in * 1000)
                        : null,
                    updatedAt: now,
                })
                .where(eq(accounts.id, existingAccount.id));
        } else {
            // Check if user exists with same email
            let [existingUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, googleUser.email))
                .limit(1);

            if (existingUser) {
                userId = existingUser.id;
                // Update user image if not set
                if (!existingUser.image && googleUser.picture) {
                    await db
                        .update(users)
                        .set({ image: googleUser.picture, updatedAt: now })
                        .where(eq(users.id, userId));
                }
            } else {
                // Create new user
                userId = randomUUID();
                await db.insert(users).values({
                    id: userId,
                    name: googleUser.name || 'User',
                    email: googleUser.email,
                    emailVerified: googleUser.verified_email || false,
                    image: googleUser.picture || null,
                    role: 'USER',
                    plan: 'FREE',
                    createdAt: now,
                    updatedAt: now,
                });
            }

            // Create account link
            await db.insert(accounts).values({
                id: randomUUID(),
                accountId: googleUser.id,
                providerId: 'google',
                userId,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || null,
                idToken: tokenData.id_token || null,
                accessTokenExpiresAt: tokenData.expires_in
                    ? new Date(now.getTime() + tokenData.expires_in * 1000)
                    : null,
                scope: tokenData.scope || null,
                createdAt: now,
                updatedAt: now,
            });
        }

        // 5. Create session
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const sessionExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await db.insert(sessions).values({
            id: randomUUID(),
            token: sessionToken,
            userId,
            expiresAt: sessionExpiry,
            ipAddress: req.ip || null,
            userAgent: req.get('user-agent') || null,
            createdAt: now,
            updatedAt: now,
        });

        // Get full user data for frontend
        const [userData] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        // 6. Encode user data for frontend
        const userPayload = encodeURIComponent(
            JSON.stringify({
                id: userData.id,
                name: userData.name,
                email: userData.email,
                image: userData.image,
                role: userData.role,
                plan: userData.plan,
            })
        );

        // Redirect to frontend with session token and user data
        res.redirect(
            `${FRONTEND_URL}/auth/callback?session_token=${sessionToken}&user=${userPayload}`
        );
    } catch (error: any) {
        console.error('Google OAuth callback error:', error);
        res.redirect(`${FRONTEND_URL}/login?error=callback_failed`);
    }
});

export default router;
