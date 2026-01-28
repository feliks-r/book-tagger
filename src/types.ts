export type Tag = {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  category?: TagCategory; // for joined queries
};

export type Profile = {
  id: string
  username: string
  role: string
  avatar_url: string | null
}

export type Book = {
  id: string;
  title: string;
  author: string;
  description?: string | null;
};

export type TagCategory = {
  id: string;
  name: string;
  display_order: number;
};

export type BookTagWithVotes = {
  id: string;
  name: string;
  description: string | null;
  //category: TagCategory;
  category_id: string;
  category_name: string;
  category_display_order: number;
  score: number;
  user_value: -1 | 0 | 1;
};

export type BookTag = {
  userValue: -1 | 0 | 1;
  score: number;
  tag: {
    id: string;
    name: string;
    description: string | null;
    category: {
      id: string;
      name: string;
      display_order: number;
    };
  };
};

export type GroupedCategory = {
    categoryId: string;
    categoryName: string;
    displayOrder: number;
    tags: BookTagWithVotes[];
};

export type TagProposal = {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
};
