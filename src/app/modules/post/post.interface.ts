export interface ICreatePostInput {
  text?: string;
  imageUrl?: string | null;
  visibility?: "PUBLIC" | "PRIVATE" | "public" | "private";
}

export interface ICursorPaginationQuery {
  cursor?: string;
  limit?: number;
}
