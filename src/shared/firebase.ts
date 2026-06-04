import admin from "firebase-admin";

interface FirebaseServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  universe_domain?: string;
}

const parseFirebasePrivateKey = (key: string): string => {
  return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
};

const getServiceAccountFromJson = (): FirebaseServiceAccount | null => {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    return null;
  }

  try {
    const parsed = JSON.parse(json) as FirebaseServiceAccount;
    if (parsed.private_key) {
      parsed.private_key = parseFirebasePrivateKey(parsed.private_key);
    }
    return parsed;
  } catch (error) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON (must be valid JSON).");
  }
};

const getServiceAccountFromEnv = (): FirebaseServiceAccount => ({
  type: process.env.FIREBASE_TYPE || "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
  private_key: parseFirebasePrivateKey(process.env.FIREBASE_PRIVATE_KEY || ""),
  client_email: process.env.FIREBASE_CLIENT_EMAIL || "",
  client_id: process.env.FIREBASE_CLIENT_ID || "",
  auth_uri:
    process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
  token_uri:
    process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url:
    process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL ||
    "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || "",
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com",
});

const serviceAccount = getServiceAccountFromJson() ?? getServiceAccountFromEnv();

const requiredFields: (keyof FirebaseServiceAccount)[] = [
  "project_id",
  "private_key",
  "client_email",
];

const missingFields = requiredFields.filter(
  (field) => !serviceAccount[field] || serviceAccount[field].trim() === ""
);

if (missingFields.length > 0) {
  throw new Error(
    `Missing Firebase service account fields: ${missingFields.join(", ")}. ` +
      "Use FIREBASE_SERVICE_ACCOUNT_JSON or individual FIREBASE_* env vars."
  );
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export default admin;
