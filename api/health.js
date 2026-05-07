const { allowMethod, sendJson } = require("./_lib/http");

module.exports = async (req, res) => {
  if (!allowMethod(req, res, "GET")) {
    return;
  }

  sendJson(res, 200, {
    ok: true,
    service: "3AM Worldwide API"
  });
};
