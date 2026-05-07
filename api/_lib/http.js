async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });

    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

function allowMethod(req, res, method) {
  const allowedMethods = Array.isArray(method) ? method : [method];

  if (allowedMethods.includes(req.method)) {
    return true;
  }

  res.setHeader("Allow", allowedMethods.join(", "));
  sendJson(res, 405, { error: `Method ${req.method} not allowed.` });
  return false;
}

module.exports = {
  allowMethod,
  readJsonBody,
  sendJson
};
