import { NewEntityRequest } from "./new-entity.request";

export type EditEntityRequest = {
  id: number
} & NewEntityRequest;
