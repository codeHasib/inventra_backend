declare module "better-auth" {
  export function betterAuth(options: any): any;
}

declare module "better-auth/adapters/mongodb" {
  import { Db, MongoClient } from "mongodb";

  interface MongoDBAdapterConfig {
    client?: MongoClient;
    debugLogs?: any;
    usePlural?: boolean;
    transaction?: boolean;
  }

  export function mongodbAdapter(
    db: Db,
    config?: MongoDBAdapterConfig,
  ): any;
}

declare module "better-auth/node" {
  import { IncomingHttpHeaders } from "node:http";

  export function fromNodeHeaders(nodeHeaders: IncomingHttpHeaders): Headers;
  export function toNodeHandler(auth: any): any;
}
