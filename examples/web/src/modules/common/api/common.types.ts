export type Paginated<T> = {
  edges: {
    cursor: string;
    node: T;
  }[];
  totalCount: string;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
};
