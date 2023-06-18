export type Paginated<T> = {
  edges: {
    cursor: string;
    node: T;
  }[];
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
};
