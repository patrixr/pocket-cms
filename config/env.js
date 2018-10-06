// Set default
let env = process.env.TRI_ENVIRONMENT;
if (env) {
    const allowedEnvs = ["dev", "staging", "prod", "test"];
    env = env.toLowerCase();
    if (allowedEnvs.indexOf(env) < 0) {
        throw new Error(`Bad environment : ${env}`);
    }
} else {
    env = "dev";
}

module.exports = function(newEnv = null) {
    if (newEnv) {
        env = newEnv;
    }
    return env;
} 