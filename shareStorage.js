const SHARE_PREFIX = "clientShare_";

export function createClientShare(reportData) {
  if (!reportData) {
    return {
      success: false,
      error: "אין נתוני דוח לשמירה",
    };
  }

  const token = createShareToken();

  const payload = {
    token,
    createdAt: new Date().toISOString(),
    storageType: "localStorage",
    version: 1,
    reportData,
  };

  try {
    localStorage.setItem(`${SHARE_PREFIX}${token}`, JSON.stringify(payload));

    return {
      success: true,
      token,
      payload,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message || "שגיאה בשמירת קישור",
    };
  }
}

export function loadClientShare(token) {
  if (!token) {
    return {
      success: false,
      error: "לא התקבל מזהה קישור",
    };
  }

  try {
    const raw = localStorage.getItem(`${SHARE_PREFIX}${token}`);

    if (!raw) {
      return {
        success: false,
        error: "הקישור לא נמצא בדפדפן זה או שפג תוקפו.",
      };
    }

    const payload = JSON.parse(raw);

    if (!payload?.reportData) {
      return {
        success: false,
        error: "הקישור קיים אך הנתונים אינם תקינים.",
      };
    }

    return {
      success: true,
      payload,
      reportData: payload.reportData,
    };
  } catch (err) {
    return {
      success: false,
      error: err?.message || "שגיאה בקריאת הקישור",
    };
  }
}

export function buildShareUrl(token) {
  const url = new URL(window.location.href);
  url.searchParams.set("share", token);
  return url.toString();
}

export function getShareModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("share");
}

function createShareToken() {
  return (
    "share_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 12)
  );
}
