declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production"; // 通常 NODE_ENV 只会是这几种
    MONGO_URL: string;
    JWT_SECRET: string;
    COOKIE_NAME: string;
    CROS_URL: string;
    CROS_PROTOCOL: string;
    CROS_DOMAIN: string;
    CROS_PORT: string;

    REDIS_HOST: string;
    REDIS_PORT: number;

    EMAIL_USER: string;
    EMAIL_PASS: string;
  }
}
