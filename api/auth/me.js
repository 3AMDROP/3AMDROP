const { allowMethod, sendJson } = require("../_lib/http");
const { requireAuthenticatedUser, sanitizeUser } = require("../_lib/auth");

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "GET")) {
    return;
  }

  try {
    const user = await requireAuthenticatedUser(req);
    sendJson(res, 200, { user: sanitizeUser(user) });
  } catch (error) {
    sendJson(res, 401, { error: error.message || "Unauthorized." });
  }
};
