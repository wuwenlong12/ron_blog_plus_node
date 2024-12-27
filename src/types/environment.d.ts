declare namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' ; // 限制 NODE_ENV 的值范围
      MONGO_URL:string
    }
  }