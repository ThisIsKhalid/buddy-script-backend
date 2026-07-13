export interface ICreatePostInput {
  text: string;
  imageUrl?: string;
  visibility?: "PUBLIC" | "PRIVATE";
}

export interface ICursorPaginationQuery {
  cursor?: string;
  limit?: number;
}
