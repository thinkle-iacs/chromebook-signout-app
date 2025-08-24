// Simple SIS API testing functions
import { logger } from "@utils/log";
export async function testSISConnection() {
  logger.logVerbose("[SIS Data] Testing basic connectivity...");

  try {
    const response = await fetch(
      "/.netlify/functions/index?mode=sisApi&testStep=connect"
    );
    return await response.json();
  } catch (error) {
    logger.logError("[SIS Data] Connection test failed:", error);
    throw error;
  }
}

export async function testSISAuth() {
  logger.logVerbose("[SIS Data] Testing SIS authentication...");

  try {
    const response = await fetch(
      "/.netlify/functions/index?mode=sisApi&testStep=auth"
    );
    return await response.json();
  } catch (error) {
    logger.logError("[SIS Data] Auth test failed:", error);
    throw error;
  }
}

export async function testStudentLookup(studentEmail: string) {
  logger.logVerbose("[SIS Data] Testing student lookup for:", studentEmail);

  try {
    const response = await fetch(
      `/.netlify/functions/index?mode=sisApi&testStep=student&studentEmail=${encodeURIComponent(
        studentEmail
      )}`
    );
    return await response.json();
  } catch (error) {
    logger.logError("[SIS Data] Student lookup failed:", error);
    throw error;
  }
}

export async function testScheduleLookup(studentEmail: string) {
  logger.logVerbose("[SIS Data] Testing schedule lookup for:", studentEmail);

  try {
    const response = await fetch(
      `/.netlify/functions/index?mode=sisApi&testStep=schedule&studentEmail=${encodeURIComponent(
        studentEmail
      )}`
    );
    return await response.json();
  } catch (error) {
    logger.logError("[SIS Data] Schedule lookup failed:", error);
    throw error;
  }
}

export function isValidStudentEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const [username, domain] = email.split("@");
  return domain === "innovationcharter.org" && username.includes(".");
}
