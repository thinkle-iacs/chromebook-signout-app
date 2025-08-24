// Simple step-by-step SIS API testing endpoint
import type { APIGatewayEvent, Context } from "aws-lambda";
declare var process: any;

export async function handler(event: APIGatewayEvent, context: Context) {
  console.log(
    "[SIS API] Request received:",
    event.httpMethod,
    event.queryStringParameters
  );

  if (event.httpMethod !== "GET") {
    console.log("[SIS API] Method not allowed:", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const { testStep, studentEmail } = event.queryStringParameters || {};
  console.log("[SIS API] Test step:", testStep, "Student email:", studentEmail);

  try {
    // Step A: Basic connectivity test
    if (testStep === "connect") {
      console.log("[SIS API] Testing basic connectivity...");
      const clientId = process.env.SIS_CLIENT_IDENTIFIER;
      const secret = process.env.SIS_SECRET;
      const url = process.env.SIS_URL;

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "SIS API endpoint is reachable",
          timestamp: new Date().toISOString(),
          environment: {
            hasClientId: !!clientId,
            hasSecret: !!secret,
            hasUrl: !!url,
            clientIdLength: clientId?.length || 0,
            urlValue: url || "not set",
          },
        }),
      };
    }

    // Step B: Test SIS authentication
    if (testStep === "auth") {
      console.log("[SIS API] Testing SIS authentication...");
      try {
        const token = await authenticateWithSIS();
        console.log(
          "[SIS API] Authentication successful, token length:",
          token?.length || 0
        );
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: "SIS authentication successful",
            hasToken: !!token,
            tokenPreview: token ? token.substring(0, 20) + "..." : "no token",
          }),
        };
      } catch (authError: any) {
        console.error("[SIS API] Authentication failed:", authError.message);
        return {
          statusCode: 401,
          body: JSON.stringify({
            error: "SIS authentication failed",
            details: authError.message,
          }),
        };
      }
    }

    // Step C: Test student lookup by email
    if (testStep === "student" && studentEmail) {
      console.log("[SIS API] Testing student lookup for:", studentEmail);
      try {
        const token = await authenticateWithSIS();
        const baseUrl = process.env.SIS_URL || "";
        const student = await lookupStudentByEmail(
          studentEmail,
          token,
          baseUrl
        );
        console.log("[SIS API] Student found:", student || "No student data");
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: "Student lookup successful",
            student: student,
          }),
        };
      } catch (lookupError: any) {
        console.error("[SIS API] Student lookup failed:", lookupError.message);
        return {
          statusCode: 404,
          body: JSON.stringify({
            error: "Student lookup failed",
            details: lookupError.message,
          }),
        };
      }
    }

    // Step D: Test schedule lookup
    if (testStep === "schedule" && studentEmail) {
      console.log("[SIS API] Testing schedule lookup for:", studentEmail);
      try {
        const token = await authenticateWithSIS();
        const baseUrl = process.env.SIS_URL || "";
        const student = await lookupStudentByEmail(
          studentEmail,
          token,
          baseUrl
        );
        const schedule = await fetchStudentClasses(student, token, baseUrl);
        console.log(
          "[SIS API] Schedule fetched, courses:",
          Array.isArray(schedule) ? schedule.length : "not array"
        );
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: "Schedule lookup successful",
            student: student,
            schedule: schedule,
          }),
        };
      } catch (scheduleError: any) {
        console.error(
          "[SIS API] Schedule lookup failed:",
          scheduleError.message
        );
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: "Schedule lookup failed",
            details: scheduleError.message,
          }),
        };
      }
    }

    // Step E: Test schedule analysis with bell schedules
    if (testStep === "analysis" && studentEmail) {
      console.log("[SIS API] Testing schedule analysis for:", studentEmail);
      try {
        const token = await authenticateWithSIS();
        const baseUrl = process.env.SIS_URL || "";
        const student = await lookupStudentByEmail(
          studentEmail,
          token,
          baseUrl
        );
        const schedule = await fetchStudentClasses(student, token, baseUrl); // Perform schedule analysis
        const analysis = analyzeStudentSchedule(student, schedule);

        console.log("[SIS API] Schedule analysis completed:", analysis);
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: "Schedule analysis successful",
            student: student,
            schedule: schedule,
            analysis: analysis,
          }),
        };
      } catch (analysisError: any) {
        console.error(
          "[SIS API] Schedule analysis failed:",
          analysisError.message
        );
        return {
          statusCode: 500,
          body: JSON.stringify({
            error: "Schedule analysis failed",
            details: analysisError.message,
          }),
        };
      }
    }

    // Default usage info
    console.log("[SIS API] Missing required parameters");
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing required parameters",
        usage:
          "Use testStep=connect|auth|student|schedule|analysis and studentEmail for student/schedule tests",
      }),
    };
  } catch (error: any) {
    console.error("[SIS API] Unexpected error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Internal server error",
        details: error.stack,
      }),
    };
  }
}

// Simple authentication function - OAuth 2.0 client credentials flow
async function authenticateWithSIS(): Promise<string> {
  const clientId = process.env.SIS_CLIENT_IDENTIFIER;
  const secret = process.env.SIS_SECRET;
  const baseUrl = process.env.SIS_URL;

  console.log("[SIS Auth] Starting OAuth 2.0 authentication...");
  console.log(
    "[SIS Auth] Client ID:",
    clientId ? `${clientId.substring(0, 8)}...` : "missing"
  );
  console.log(
    "[SIS Auth] Secret:",
    secret ? `${secret.substring(0, 8)}...` : "missing"
  );
  console.log("[SIS Auth] Base URL:", baseUrl || "missing");

  if (!clientId || !secret || !baseUrl) {
    throw new Error(
      "SIS API configuration missing - need SIS_CLIENT_IDENTIFIER, SIS_SECRET, and SIS_URL environment variables"
    );
  }

  // OAuth 2.0 Client Credentials Flow
  // Extract base domain from the OneRoster URL for OAuth endpoint
  const baseUrlParts = baseUrl.replace(/\/+$/, "").split("/");
  const domain = baseUrlParts.slice(0, 3).join("/"); // https://domain.com
  const tokenUrl = `${domain}/oauth/rest/v2.0/auth`;
  console.log("[SIS Auth] Base URL:", baseUrl);
  console.log("[SIS Auth] Extracted domain:", domain);
  console.log("[SIS Auth] Token URL:", tokenUrl);

  try {
    // Create Basic Auth header with client credentials (base64 encode manually)
    const credentials = btoa(`${clientId}:${secret}`);

    console.log("[SIS Auth] Making OAuth token request...");
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: "grant_type=client_credentials",
    });

    console.log("[SIS Auth] Token response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[SIS Auth] Token request failed:", errorText);
      throw new Error(
        `OAuth authentication failed: ${response.status} - ${errorText}`
      );
    }

    const tokenData = await response.json();
    console.log("[SIS Auth] Token data received:", {
      hasAccessToken: !!tokenData.access_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
    });

    if (!tokenData.access_token) {
      throw new Error("No access token received from SIS OAuth endpoint");
    }

    return tokenData.access_token;
  } catch (error: any) {
    console.error("[SIS Auth] Authentication error:", error);
    throw new Error(`SIS authentication failed: ${error.message}`);
  }
}

// Simple student lookup function - OneRoster v1.1 compliant
async function lookupStudentByEmail(
  email: string,
  authToken: string,
  baseUrl: string
): Promise<any> {
  console.log("[SIS Lookup] Looking up student:", email);

  // OneRoster v1.1 endpoint for users with email filter
  const encodedEmail = encodeURIComponent(`email='${email}'`);
  // baseUrl already includes /ims/oneroster/v1p1/, so just append the endpoint
  const cleanBaseUrl = baseUrl.replace(/\/+$/, ""); // Remove trailing slashes
  const url = `${cleanBaseUrl}/users?limit=100&offset=0&orderBy=asc&filter=${encodedEmail}`;
  console.log("[SIS Lookup] Base URL:", baseUrl);
  console.log("[SIS Lookup] Clean base URL:", cleanBaseUrl);
  console.log("[SIS Lookup] Request URL:", url);

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  console.log("[SIS Lookup] Response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log("[SIS Lookup] Error response:", errorText);
    throw new Error(
      `SIS API error looking up student: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  console.log("[SIS Lookup] Response data:", JSON.stringify(data, null, 2));

  // OneRoster v1.1 response structure
  if (!data.users || data.users.length === 0) {
    throw new Error(`Student not found with email: ${email}`);
  }

  // Find student (role = 'student')
  const student = data.users.find((user: any) => user.role === "student");
  if (!student) {
    throw new Error(
      `No student found with email: ${email} (found ${data.users.length} users but none with role 'student')`
    );
  }

  return student;
}

// Fetch teachers for a given class using OneRoster v1.1 API
async function fetchTeachersForClass(
  classId: string,
  authToken: string,
  baseUrl: string
): Promise<any[]> {
  console.log("[SIS Teachers] Fetching teachers for class:", classId);

  if (!classId) {
    throw new Error("Class ID is required to fetch teachers");
  }

  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  const url = `${cleanBaseUrl}/classes/${classId}/teachers?limit=100&offset=0&orderBy=asc`;
  console.log("[SIS Teachers] Request URL:", url);

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  console.log("[SIS Teachers] Response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log("[SIS Teachers] Error response:", errorText);
    throw new Error(
      `SIS API error getting teachers: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  console.log("[SIS Teachers] Response data:", JSON.stringify(data, null, 2));

  // OneRoster v1.1 response structure: { teachers: [...] }
  return Array.isArray(data.users) ? data.users : [];
}

// Simple schedule fetch function - OneRoster v1.1 compliant
async function fetchStudentClasses(
  student: any,
  authToken: string,
  baseUrl: string
): Promise<any> {
  console.log(
    "[SIS Classes] Fetching classes for student:",
    student?.sourcedId || "unknown"
  );

  if (!student?.sourcedId) {
    throw new Error("Student sourcedId is required to fetch classes");
  }

  // OneRoster v1.1 endpoint for student's classes
  const cleanBaseUrl = baseUrl.replace(/\/+$/, ""); // Remove trailing slashes
  const url = `${cleanBaseUrl}/students/${student.sourcedId}/classes?limit=100&offset=0&orderBy=asc`;
  console.log("[SIS Classes] Base URL:", baseUrl);
  console.log("[SIS Classes] Clean base URL:", cleanBaseUrl);
  console.log("[SIS Classes] Request URL:", url);

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  console.log("[SIS Classes] Response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log("[SIS Classes] Error response:", errorText);
    throw new Error(
      `SIS API error getting classes: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  console.log("[SIS Classes] Response data:", JSON.stringify(data, null, 2));

  // Add teacher data to classes
  if (Array.isArray(data.classes)) {
    for (const cls of data.classes) {
      cls.teachers = await fetchTeachersForClass(
        cls.sourcedId,
        authToken,
        baseUrl
      );
    }
  }

  return data;
}

// Simple schedule analysis function - placeholder for actual analysis logic
function analyzeStudentSchedule(student: any, schedule: any): any {
  console.log(
    "[SIS Analysis] Analyzing schedule for student:",
    student?.sourcedId || "unknown"
  );

  // Placeholder: Implement actual analysis logic here
  const analysis = {
    totalCredits: 0,
    classesCount: 0,
    // Add more analysis fields as needed
  };

  if (Array.isArray(schedule)) {
    analysis.classesCount = schedule.length;
    // Calculate total credits or other metrics based on schedule data
  }

  console.log("[SIS Analysis] Schedule analysis result:", analysis);
  return analysis;
}
