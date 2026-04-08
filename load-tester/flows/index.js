import getUser from "./users/get-user.js";
import health from "./system/health.js";
import userJourney from "./users/user-journey.js";
import userLogin from "./users/user-login.js";
import userLogout from "./users/user-logout.js";
import userMe from "./users/user-me.js";
import userMix from "./users/user-mix.js";
import userUpdate from "./users/user-update.js";
import postRead from "./posts/post-read.js";
import errorMix from "./errors/error-mix.js";
import errorNotFound from "./errors/not-found.js";
import errorUnauthorized from "./errors/unauthorized.js";
import errorServer from "./errors/server-error.js";
import errorNonJson from "./errors/non-json.js";
import errorTimeout from "./errors/timeout.js";

// 흐름 이름 -> 함수 매핑
const flows = {
  health,
  "get-user": getUser,
  "user-journey": userJourney,
  "user-login": userLogin,
  "user-logout": userLogout,
  "user-me": userMe,
  "user-mix": userMix,
  "user-update": userUpdate,
  "post-read": postRead,
  "error-mix": errorMix,
  "error-404": errorNotFound,
  "error-401": errorUnauthorized,
  "error-500": errorServer,
  "error-non-json": errorNonJson,
  "error-timeout": errorTimeout,
};

// 등록된 흐름을 이름으로 조회
export function getFlow(name) {
  return flows[name];
}
