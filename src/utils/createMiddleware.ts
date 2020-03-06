import { Resolver, GraphQLMiddlewareFn } from "../types/graphql-utils";

export const createMiddleware = (
  middlewareFn: GraphQLMiddlewareFn,
  resolverFn: Resolver
) => (parent: any, args: any, context: any, info: any) =>
  middlewareFn(resolverFn, parent, args, context, info);
