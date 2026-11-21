/** One of three fixed kinds of Muay Thai video. */
export type Category = "Training" | "Fights" | "History";

export interface Video {
  id: string;
  title: string;
  channel: string;
  category: Category;
  durationSeconds: number;
}

/** Each category's pool: the current set of eligible videos that sessions are drawn from. */
export type Pools = Record<Category, Video[]>;
